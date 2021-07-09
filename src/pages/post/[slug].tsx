import { GetStaticPaths, GetStaticProps } from 'next';
import Head from "next/head";
import Link from "next/link";

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';

import Header from '../../components/Header';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import { Comments } from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  postsNavigation: {
    nextPost?: {
      slug: string;
      title: string;
    };
    prevPost?: {
      slug: string;
      title: string;
    };
  };
  preview: boolean;
}

export default function Post({ post, postsNavigation, preview }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  const wordsNum = post.data.content.reduce((acc, item) => {
    acc += item.heading.split(' ').length;
    const bodyWords = item.body.map((item) => item.text.split(' ').length);
    bodyWords.map((value) => acc += value);

    return acc;
  }, 0);

  const readTimeMins = Math.ceil(wordsNum / 200);

  const formatedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  const formatedLastPublicationDate = post.last_publication_date !== post.first_publication_date ? (
    format(
      new Date(post.last_publication_date),
      "'* editado em ' dd MMM yyyy', às' H':'m",
      {
        locale: ptBR,
      }
    )
  ) : null;

  return (
    <>
      <Head>
        <title>Posts | spacetraveling</title>
      </Head>
      <div 
        className={commonStyles.mainContainer}
        style={{
          paddingLeft: 0,
          paddingRight: 0,
        }}
      >
        <Header />
        <img
          src={post.data.banner.url}
          alt="Post Banner"
          style={{
            width: '100%',
            height: '25rem',
            objectFit: 'cover',
          }}
        />
        <div className={styles.postContainer}>
          <h1>{post.data.title}</h1>
          <div
            className={styles.postInfoContainer}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <FiCalendar size={15} color="#BBB" />
              <p className={commonStyles.infoText}>
                {formatedDate}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <FiUser size={15} color="#BBB" />
              <p className={commonStyles.infoText}>
                {post.data.author}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <FiClock size={15} color="#BBB" />
              <p className={commonStyles.infoText}>
                {readTimeMins} min
              </p>
            </div>
          </div>
          {
            formatedLastPublicationDate && (
              <p
                style={{
                  marginTop: "1.125rem",
                  fontSize: "0.875rem",
                  fontStyle: "italic",
                  color: "#BBBBBB"
                }}
              >
                {formatedLastPublicationDate}
              </p>
            )
          }
          <div
            className={styles.contentContainer}
          >
            {
              post.data.content.map((item) => {
                return (
                  <div key={item.heading}>
                    <h1 className={styles.contentHeading}>
                      {item.heading}
                    </h1>
                    <div>
                      {
                        item.body.map((item) => {
                          return (
                            <p
                              key={item.text}
                            >
                              {item.text}
                            </p>
                          );
                        })
                      }
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
        <div className={styles.navigationContainer}>
          {
            postsNavigation.prevPost && (
              <div
                className={styles.postNavContainer}
                style={{
                  marginRight: "auto",
                }}
              >
                <h1>{postsNavigation.prevPost.title}</h1>
                <a 
                  href={`/post/${postsNavigation.prevPost.slug}`}
                >
                  Post anterior
                </a>
              </div>
            )
          }
          {
            postsNavigation.nextPost && (
              <div
                className={styles.postNavContainer}
                style={{
                  marginLeft: "auto",
                }}
              >
                <h1
                  style={{
                    textAlign: "right",
                  }}
                >
                  {postsNavigation.nextPost.title}
                </h1>
                <a
                  href={`/post/${postsNavigation.nextPost.slug}`}
                  style={{
                    marginLeft: "auto"
                  }}
                >
                  Próximo post
                </a>
              </div>
            )
          }
        </div>
        <Comments />
        {preview && (
          <aside 
            className={commonStyles.previewModeBtn}
            style={{
              marginTop: "3rem",
            }}
          >
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </div>
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([Prismic.Predicates.at('document.type', 'posts')]);

  const paths = posts.results.map((post) => {
    return {
      params: {
        slug: post.uid,
      }
    }
  });

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', params.slug, { ref: previewData?.ref || null });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );


  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map((item) => {
        return {
          heading: item.heading,
          body: [
            ...item.body
          ],
        };
      })
    },
  }

  return {
    props: {
      post,
      postsNavigation: {
        prevPost: prevPost?.results[0] ? {
          slug: prevPost?.results[0]?.uid,
          title: prevPost?.results[0]?.data?.title,
        } : null,
        nextPost: nextPost?.results[0] ? {
          slug: nextPost?.results[0]?.uid,
          title: nextPost?.results[0]?.data?.title,
        } : null,
      },
      preview,
    },
  }
};
